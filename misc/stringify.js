import { querySepanaProjects } from "../main/utils";

querySepanaProjects.then(res => console.log(JSON.stringify(res)))