const { fetchFile } = FFmpegUtil;
const { FFmpeg } = FFmpegWASM;
let ffmpeg = null
let zip = null
const dir_name = "frames";

function getElementByIdOrDie(id) {
	const el = document.getElementById(id);
	if (el === null)
		throw new Error("Could not find element " +  id);
	return el;
}

const split = async ({target: {files}}) => {
	console.log("Running Split!");
	await ffmpeg.load({
		coreURL: "../../../core/dist/umd/ffmpeg-core.js",
		wasmURL: "../../../core/dist/umd/ffmpeg-core.wasm",
	});

	const {name} = files[0];
	await ffmpeg.writeFile(name, await fetchFile(files[0]));
	await ffmpeg.createDir(dir_name);
	await ffmpeg.exec([
		'-i', name,
		'-vf', 'fps=8', 
		dir_name + '/frame-%03d.png',
	]);

	const frames = await ffmpeg.listDir(dir_name);
	for (let i = 0; i < frames.length; i++) {
		if (frames[i].isDir == true)
			continue;
		const file_path = dir_name + "/" + frames[i].name;
		const file = await ffmpeg.readFile(file_path);
		zip.file(file_path, new Blob([file.buffer], {type: "image/png"}));
	}

	zip.generateAsync({type: "blob"}).then((blob) => {
		saveAs(blob, dir_name + ".zip");
	})
}

window.onload = () => {
	console.log("Hello World!")
	ffmpeg = new FFmpeg();
	ffmpeg.on("log", ({message}) => {
		console.log(message);
	})
	ffmpeg.on("progress", ({progress}) => {
		const prog = getElementByIdOrDie("prog");
		prog.value = progress;
	})
	zip = new JSZip();

	const el = getElementByIdOrDie("para");
	el.addEventListener("change", split)
}
