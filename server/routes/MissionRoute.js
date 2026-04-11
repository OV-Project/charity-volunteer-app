import express from 'express';
const router = express.Router();

import {
    CreateMission,Getmissions,Updatemission,deletemission

} from "../controllers/missionController.js"

router.route("/").get(Getmissions);
router.route("/create").post(CreateMission);
router.route("/update").put(Updatemission);
router.route("/delete").delete(deletemission);

export default router;