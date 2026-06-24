import mongoose from 'mongoose';

const changeLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true
  },
  screenSetName: {
    type: String,
    required: true
  },
  devName: {
    type: String,
    required: true,
    trim: true
  },
  ticketName: {
    type: String,
    required: true,
    trim: true
  },
  // Custom manual typing input parameters
  backupScreenSet: {
    type: String,
    required: true,
    trim: true
  },
  screenMadeByDev: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String // DD/MM/YYYY
  },
  dateTimeIST: {
    type: String // HH:MM AM/PM
  },
  description: {
    type: String,
    required: true
  }
}, {
  timestamps: true 
});

// Middleware: Auto-generate 12-hour IST format strings on Save
changeLogSchema.pre('save', function (next) {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDateObj = new Date(istString);

  this.date = istDateObj.toLocaleDateString("en-GB");

  let hours = istDateObj.getHours();
  const minutes = istDateObj.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; 
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;

  this.dateTimeIST = `${hours}:${minutesStr} ${ampm}`;
  
  next();
});

const ChangeLog = mongoose.model('ChangeLog', changeLogSchema);
export default ChangeLog;