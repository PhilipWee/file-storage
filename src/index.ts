import { EzBackend, EzModel, Type, EzApp } from '@ezbackend/common';
import { EzOpenAPI } from '@ezbackend/openapi';
import { EzDbUI } from '@ezbackend/db-ui';
import { EzCors } from '@ezbackend/cors';

//FS related imports
import fs from 'fs'
import fastifyMultipart from 'fastify-multipart';
import util from 'util'
import { pipeline } from 'stream';
import {v4} from 'uuid'
import path from 'path'
import fastifyStatic from 'fastify-static'


/**
 * TODO
 * Multer Compatible Engines
 * Auto generated endpoints
 * 
 */

const pump = util.promisify(pipeline)


const app = new EzBackend();

// ---Plugins---
// Everything is an ezapp in ezbackend
app.addApp(new EzOpenAPI());
app.addApp(new EzDbUI());
app.addApp(new EzCors());
// ---Plugins---

async function onFile(part) {

  const outputPath = path.join('./tmp/uploads/file-storage/',v4()+'-'+part.filename)

  await pump(part.file, fs.createWriteStream(outputPath))
}

app.register(fastifyMultipart, {
  attachFieldsToBody: true,
  onFile: onFile,
})

app.register(fastifyStatic,{
  root: path.join(__dirname,'../tmp/uploads'),
  prefix: '/public/'
})

const fileStorage = new EzApp()

fileStorage.post('/', {
  schema: {
    consumes: ['multipart/form-data'],
    body: {
      type: 'object',
      properties: {
        name: {
          type: 'object',
          properties: {
            value: {
              type: 'string'
            }
          }
        },
        img: {
          isFileType: true
        }
      }
    }
  },
}, async function (req, res) {

  await (req.body as any).img

  res.send({ success: true })
})


app.addApp(fileStorage, { prefix: 'file-storage' });

function ajvPlugin(ajv, opts) {
  ajv.addKeyword('isFileType', {
    compile: (schema, parent, it) => {
      return () => true
    }
  })
  return ajv
}

app.start({
  openAPI: {
    transform: schema => {
      if (schema?.body?.properties?.img?.isFileType === true) {
        schema.body.properties.img['type'] = 'file'
        schema.body.properties.name = { type: 'string' }
      }
      return schema
    }
  },
  backend: {
    fastify: {
      ajv: {
        //@ts-ignore
        plugins: [ajvPlugin]
      }
    }
  }
});