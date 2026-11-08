import { defineConfig } from 'vite';
import {realpathSync,readFileSync} from 'node:fs';
const {version}=JSON.parse(readFileSync(new URL('./package.json',import.meta.url),'utf8'));
export default defineConfig({root:realpathSync.native(process.cwd()),base:'./',define:{__APP_VERSION__:JSON.stringify(version)},server:{port:5186,strictPort:true},preview:{port:4186,strictPort:true}});
