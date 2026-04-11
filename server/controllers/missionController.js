import Mission from "../models/Mission.js";
import User from "../models/User.js";

//creating mission
const CreateMission =  async(req,res) => {
    try {
// 1. Authorization: only organizations can create missions
    if (req.user.role !== 'organization') {
      return res.status(403).json({ message: "Only organizations can create missions" });
    }
// 2. Extract data from request body
    const missionData = req.body;
// 3. Business rule: if mission is presential, coordinates are required
    if (missionData.type === 'presential') {
      if (!missionData.location || !missionData.location.coordinates) {
        return res.status(400).json({ 
          message: "Location coordinates are required for presential missions" 
        });
      }
    }
// 4. Set organizationId and createdBy from authenticated user
    missionData.organizationId = req.user._id;
    missionData.createdBy = req.user._id;
// 5. Create mission instance    
    const mission = new Mission(missiondata);
// 6. Save to database
        const savedmission = await mission.save();    
        res.status(200).json({
            message : "mission created",
            mission : savedmission});
        
} catch (error) {
    // 8. Improved error handling based on error type
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) { // duplicate key error (e.g., qrCode)
      return res.status(409).json({ message: "Duplicate value for unique field (e.g., QR code)" });
    }
    // Log unexpected errors (use your logger)
    console.error('Mission creation error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};
    


//listing all missions
const Getmissions =  async(req,res) => {
    try{
    const missions = await Mission.find();
    res.status(200).json(missions);
    }
    catch(error){
        res.status(500).json({message : error.message});
    }
}

//updating mission
const Updatemission =  async(req,res) => {
    try {
        const {id} = req.params;
        const updates = req.body;
    // 1. Authorization: only organizations can update        
        if(req.user.role !== 'organization'){
            return res.status(403).json({ message: "You are not an organization" });
        }
    // 2. Find the mission to check ownership        
        const mission = await Mission.findById(id);
        if (!mission) {
          return res.status(404).json({ message: "Mission not found" })  
        }

    // 3. Check if the logged-in user is the owner        
        if (mission.organizationId.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: "You are not the mission owner" });  
        }

    // 4. Prevent updating protected fields        
        delete updates.organizationId;
        delete updates.createdBy;
        delete updates._id;   

    // 5. Update the mission
        const updatedmission = await Mission.findByIdAndUpdate(id,updates, {
            new : true,
            runValidators : true
        });
        res.status(200).json({
      message: "Mission updated successfully",
      mission: updatedMission
    });
    }
catch (error) {
    res.status(500).json({ message: error.message });
  }}



//deleting mission
const deletemission = async (req,res) => {
 try {
        const {id} = req.params;
    // 1. Authorization: only organizations can update        
        if(req.user.role !== 'organization'){
            return res.status(403).json({ message: "You are not an organization" });
        }
    // 2. Find the mission to check ownership        
        const mission = await Mission.findById(id);
        if (!mission) {
          return res.status(404).json({ message: "Mission not found" })  
        }

    // 3. Check if the logged-in user is the owner        
        if (mission.organizationId.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: "You are not the mission owner" });  
        }
        const deletedmission = await Mission.findByIdAndDelete(id);
        res.status(200).json({
        message: "Mission updated successfully",
        mission: updatedMission
        });
    
    }
        catch(error){
            res.status(500).json({ message: error.message });
        }
    }

export{CreateMission,Getmissions,Updatemission,deletemission}

