require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://j4rbox_admin:JayRide4@j4r-box-cluster.lggjbql.mongodb.net/j4rbox';

const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  stock: Number,
  image: String,
  description: String,
  createdAt: Date
});

const Product = mongoose.model('Product', productSchema);

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Update virtual to digital
    const virtual = await Product.updateMany(
      { category: 'virtual' },
      { $set: { category: 'digital' } }
    );
    console.log(`✅ Updated ${virtual.modifiedCount} virtual → digital`);
    
    // Update accessory to physical
    const accessory = await Product.updateMany(
      { category: 'accessory' },
      { $set: { category: 'physical' } }
    );
    console.log(`✅ Updated ${accessory.modifiedCount} accessory → physical`);
    
    // Fix currency stock
    const currency = await Product.updateMany(
      { category: 'currency' },
      { $set: { stock: 999 } }
    );
    console.log(`✅ Fixed ${currency.modifiedCount} currency stock`);
    
    const all = await Product.find();
    console.log('\n📦 All products:');
    all.forEach(p => {
      console.log(`  ${p.name} | ${p.category} | Stock: ${p.stock}`);
    });
    
    mongoose.connection.close();
    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

migrate();