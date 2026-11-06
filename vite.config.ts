import { defineConfig } from 'vite';
import {realpathSync} from 'node:fs';
export default defineConfig({root:realpathSync.native(process.cwd()),base:'./',server:{port:5186,strictPort:true},preview:{port:4186,strictPort:true}});
