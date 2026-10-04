// Generate Mosswick's voice lines with ElevenLabs. Reads lines from voice/lines.json and writes voice/<id>.mp3.
// The API key comes from the ELEVENLABS_API_KEY environment variable and is never written anywhere.
//   node make-voice.mjs            generate any clip that does not exist yet
//   node make-voice.mjs --force    regenerate everything
//   node make-voice.mjs taunt05    regenerate the named clips (ids)
// Then run `python build.py` to embed the clips in the game. The finished mp3 files are committed, so the key is only
// needed to change or add lines.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), dir = path.join(here, 'voice');
const key = process.env.ELEVENLABS_API_KEY;
if (!key) { console.error('Set ELEVENLABS_API_KEY first.'); process.exit(2); }
const config = JSON.parse(fs.readFileSync(path.join(dir, 'lines.json'), 'utf8'));
const args = process.argv.slice(2), force = args.includes('--force'), only = args.filter(a => !a.startsWith('--'));
const wanted = item => (only.length ? only.includes(item.id) : force || !fs.existsSync(path.join(dir, item.id + '.mp3')));
async function post(url, body) {
  const response = await fetch(url, {method: 'POST', headers: {'xi-api-key': key, 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  if (!response.ok) throw new Error(response.status + ' ' + (await response.text()).slice(0, 300));
  return Buffer.from(await response.arrayBuffer());
}
let made = 0, characters = 0;
for (const line of config.lines.filter(wanted)) {
  const audio = await post(`https://api.elevenlabs.io/v1/text-to-speech/${config.voice.id}?output_format=mp3_44100_64`,
    {text: line.text, model_id: config.voice.model, voice_settings: config.voice.settings});
  fs.writeFileSync(path.join(dir, line.id + '.mp3'), audio);
  made++; characters += line.text.length; console.log('speech', line.id, audio.length + ' bytes');
}
for (const effect of (config.effects || []).filter(wanted)) {
  const audio = await post('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_64',
    {text: effect.prompt, duration_seconds: effect.seconds, prompt_influence: 0.5});
  fs.writeFileSync(path.join(dir, effect.id + '.mp3'), audio);
  made++; console.log('effect', effect.id, audio.length + ' bytes');
}
console.log(`${made} clip(s) generated, ${characters} characters of speech.`);
