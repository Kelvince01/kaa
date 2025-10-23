import app from "./app";
import { config } from "./config";

app.listen(config.app.port, () => {
	console.log(`🦊 TFML is running at ${config.app.url}`);
});
