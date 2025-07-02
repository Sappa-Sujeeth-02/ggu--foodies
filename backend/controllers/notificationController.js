import restaurantModel from '../models/restaurantModel.js';

const saveRestaurantFcmToken = async (req, res) => {
  const { fcmToken } = req.body;
  const restaurantId = req.restaurant.id;

  try {
    await restaurantModel.findByIdAndUpdate(
      restaurantId,
      { fcmToken },
      { upsert: true }
    );
    res.status(200).json({ success: true, message: 'Restaurant FCM token saved successfully' });
  } catch (error) {
    console.error('Error saving restaurant FCM token:', error);
    res.status(500).json({ success: false, message: 'Failed to save token', error: error.message });
  }
};

export { saveRestaurantFcmToken };