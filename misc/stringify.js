import { querySepanaProjects } from "../main/utils.js";
import * as fs from 'fs';

querySepanaProjects().then(json => fs.writeFileSync("sepana-records.json", JSON.stringify(json)))