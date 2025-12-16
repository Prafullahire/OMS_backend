const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
    const { orderItems, totalPrice } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400).json({ message: 'No order items' });
        return;
    } else {
        // First pass: Validate stock
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (!product) {
                res.status(404).json({ message: `Product not found: ${item.name}` });
                return;
            }
            if (product.countInStock < item.qty) {
                res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.countInStock}` });
                return;
            }
        }

        // Second pass: Reduce stock
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            product.countInStock = product.countInStock - item.qty;
            await product.save();
        }

        const order = new Order({
            orderItems,
            user: req.user._id,
            totalPrice
        });

        const createdOrder = await order.save();

        res.status(201).json(createdOrder);
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
        'user',
        'name email'
    );

    if (order) {
        // Enforce ownership or admin
        if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
            res.status(401).json({ message: 'Not authorized to view this order' });
            return;
        }
        res.json(order);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.status = req.body.status || order.status;
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Assign Warehouse and Delivery Boy (Book Pickup)
// @route   PUT /api/orders/:id/logistics
// @access  Private/Admin
const assignLogistics = async (req, res) => {
    const { warehouse, deliveryBoyId } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
        order.warehouse = warehouse;
        order.deliveryBoy = deliveryBoyId;
        order.status = 'ReadyForPickup'; // Auto update status

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
    const orders = await Order.find({}).populate('user', 'id name');
    res.json(orders);
};

module.exports = {
    addOrderItems,
    getOrderById,
    updateOrderStatus,
    assignLogistics,
    getMyOrders,
    getOrders,
};
