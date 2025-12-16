const mongoose = require('mongoose');
const User = require('./server/models/User'); // Adjust path as needed
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

const fixAdmin = async () => {
    try {
        const user = encodeURIComponent(process.env.DB_USER);
        const pass = encodeURIComponent(process.env.DB_PASS);
        const dbName = process.env.DB_NAME;
        const host = process.env.DB_HOST;
        const mongoURI = `mongodb+srv://${user}:${pass}@${host}/${dbName}?retryWrites=true&w=majority`;

        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        const adminUser = await User.findOne({ email: 'e2e_admin@test.com' });
        if (adminUser) {
            adminUser.role = 'admin';
            await adminUser.save();
            console.log('User e2e_admin@test.com promoted to ADMIN.');
        } else {
            console.log('User not found.');
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

fixAdmin();
