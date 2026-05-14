const Booking = require("../models/Booking");
const Report = require("../models/Report");

const getTechnicianBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      bookingStatus: { $in: ["Confirmed", "Sample Collected", "Processing"] }
    }).sort({ updatedAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching technician bookings" });
  }
};

const updateSampleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["Sample Collected", "Processing"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid technician status" });
    }

    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.bookingStatus = status;
    booking.status = status;
    await booking.save();

    res.json({ message: `Booking status updated to ${status}`, booking });
  } catch (error) {
    res.status(500).json({ message: "Status update failed", error: error.message });
  }
};

const submitReport = async (req, res) => {
  try {
    const { results, technicianRemarks } = req.body;

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ message: "At least one test result is required" });
    }

    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const report = await Report.findOneAndUpdate(
      { bookingId: booking._id },
      {
        userId: booking.userId,
        bookingId: booking._id,
        testName: booking.testName,
        results,
        technicianRemarks,
        status: "Pending Review"
      },
      { upsert: true, new: true, runValidators: true }
    );

    booking.bookingStatus = "Processing";
    booking.status = "Processing";
    await booking.save();

    res.json({ message: "Report submitted for pathologist review", report });
  } catch (error) {
    res.status(500).json({ message: "Report submission failed", error: error.message });
  }
};

module.exports = { getTechnicianBookings, updateSampleStatus, submitReport };
