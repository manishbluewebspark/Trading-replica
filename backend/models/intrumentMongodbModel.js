import mongoose from "mongoose";

const instrumentSchema = new mongoose.Schema({
  token: {
     type: String,
      required: true,
       index: true
     },
  symbol: { 
    type: String,
    required: true
    },
  name: {
     type: String,
      required: true 
    },
  expiry: { type: String, default: "" },
  lotsize: { 
    type: String,
     default: "1"
    },
  exch_seg: {
     type: String,
      default: "" 
    },
    SyNum:{
    type: String,
    default:""
    },
    syType:{
         type: String,
       default:""

    }
});

instrumentSchema.index({ name: "text" ,symbol:"text",SyNum:"text",});

export const Instrument = mongoose.model("Instrument", instrumentSchema);