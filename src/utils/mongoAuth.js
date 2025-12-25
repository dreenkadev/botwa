// MongoDB Auth State for Baileys
// Menyimpan session ke MongoDB agar persist setelah restart

const mongoose = require('mongoose');
const { proto } = require('@whiskeysockets/baileys');
const { initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');

// Schema untuk menyimpan auth data
const AuthSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

const AuthModel = mongoose.models.Auth || mongoose.model('Auth', AuthSchema);

// Connect ke MongoDB
async function connectMongoDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.log('[MongoDB] MONGODB_URI not set, using file-based session');
        return false;
    }

    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 10000
            });
            console.log('[MongoDB] Connected successfully');
        }
        return true;
    } catch (err) {
        console.log('[MongoDB] Connection failed:', err.message);
        return false;
    }
}

// MongoDB Auth State Handler
async function useMongoDBAuthState() {
    const connected = await connectMongoDB();

    if (!connected) {
        // Fallback ke file-based jika MongoDB tidak tersedia
        const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
        return useMultiFileAuthState('./session');
    }

    const writeData = async (key, data) => {
        try {
            const serialized = JSON.stringify(data, BufferJSON.replacer);
            await AuthModel.findOneAndUpdate(
                { _id: key },
                { value: JSON.parse(serialized) },
                { upsert: true, new: true }
            );
        } catch (err) {
            console.log('[MongoDB] Write error:', key, err.message);
        }
    };

    const readData = async (key) => {
        try {
            const doc = await AuthModel.findById(key);
            if (!doc) return null;
            return JSON.parse(JSON.stringify(doc.value), BufferJSON.reviver);
        } catch (err) {
            console.log('[MongoDB] Read error:', key, err.message);
            return null;
        }
    };

    const removeData = async (key) => {
        try {
            await AuthModel.deleteOne({ _id: key });
        } catch (err) {
            console.log('[MongoDB] Delete error:', key, err.message);
        }
    };

    // Load or init creds
    const creds = await readData('creds') || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            tasks.push(value ? writeData(key, value) : removeData(key));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => writeData('creds', creds)
    };
}

// Clear all session data
async function clearMongoDBSession() {
    try {
        const connected = await connectMongoDB();
        if (connected) {
            await AuthModel.deleteMany({});
            console.log('[MongoDB] Session cleared');
        }
    } catch (err) {
        console.log('[MongoDB] Clear error:', err.message);
    }
}

module.exports = { useMongoDBAuthState, clearMongoDBSession, connectMongoDB };
