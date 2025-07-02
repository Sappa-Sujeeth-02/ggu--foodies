import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  restaurantid: {
    type: String,
    required: true,
    unique: true,
  },
  restaurantname: {
    type: String,
    required: true,
  },
  restaurantemail: {
    type: String,
    required: true,
    unique: true,
  },
  restaurantpassword: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    match: [/^\d{10}$/, 'Phone number must be exactly 10 digits'],
  },
  address: {
    type: String,
    required: true,
  },
  availability: {
    type: Boolean,
    default: true,
  },
  image: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  orderCount: {
    type: Number,
    default: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },
  fcmToken: {
    type: String,
    default: '',
  },
  slotCapacity: {
  type: [
    {
      slot: { type: String, required: true },
      maxOrders: { type: Number, required: true, min: 0 },
      currentOrders: {
        type: Number,
        default: 0,
        min: [0, 'Current orders cannot be negative'],
      },
    },
  ],
  default: [
    { slot: "12:35-12:45", maxOrders: 10, currentOrders: 0 },
    { slot: "12:45-12:55", maxOrders: 10, currentOrders: 0 },
    { slot: "12:55-1:05", maxOrders: 10, currentOrders: 0 },
  ],
},

  preOrderEnabled: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  minimize: false,
});

const restaurantModel = mongoose.models.Restaurant || mongoose.model('Restaurant', restaurantSchema);

export default restaurantModel;