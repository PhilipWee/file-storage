# Overview

Maybe for example if its like reddit where posts can have videos or pictures

```ts
const post = new EzModel("Post", {
  summary: Type.VARCHAR,
  desc: Type.VARCHAR,
  image: Type.FILE,
  video: {
    type : Type.FILE
    multerOpts: ...opts
    ...fileOpts // These options more for any options that ezbackend requires
  }
});
```

# Endpoints Generated

## New `multipart/form-data` for `create` and `update`

For the same `Create` and `Update` endpoints, if the input type is `multipart/form-data`, then it will be parsed as such

The restrictions depend on the properties set on `EzModel`


## `Read` Endpoint

For the `Read` endpoint, there are two scenarios

### Local dev environment

In the local dev environment we can provide a generated url for the file (serve from a static-ish folder?) For example `localhost:8000/files/Posts/image/your-avatar-123456789.png`

Then just serve the file using `fastify-static`

This is probably not very performant but good enough for local testing purposes

### Production 

In the production environment we can provide a generated url but basically its the URL from s3 (Presigned) for the user to download

We can also add an option for how long the access to the `presigned url` should be for, for maximum customisability

### But how do we obtain the presigned URL?

As long as the backend has the S3 compatible bucket credentials, the validation for correct user can be done on EzBackend side as specified in [security](#security)


### Possible Caveats

Because S3 storage and local storage is different, there may be dev environment differences that cause issues. Perhaps we can add a warning message to use S3 even for `testing/dev` environments to prevent these mistakes?

See [this article](https://news.ycombinator.com/item?id=10002142) for some arguments for and against

Also, even for S3 compatible storages, I'm sure there are minor differences, but as long as we handle digital ocean spaces/ aws s3 or whatever properly it should be okay, but something to take note while implementing


## `Delete` Endpoint

No changes for the `Delete` endpoint

## API Documentation

The API Documentation needs to be updated accordingly

## Edge cases considerations

### If file upload is compulsory

If file upload is compulsory, then the `application/json` endpoint wouldn't work, so the end user is forced to use the `multipart/form-data` one... Is that okay? I mean he did make uploading the file compulsory

### If there is default for file

If there are defaults for the file, then the `application/json` endpoint would work, but just don't include the property for the file in the validation schema

However, on the server side, the default value for the file would have to be manually uploaded each time... Perhaps we could make it such that they all share the same default file to save space on the file server, but I suggest we leave that as a TODO

Alternatively, if the user specifies the field with a `default` then we can internally make the field `nullable` but add a hook to provide a link to the static resource specified as the default

### If the file upload is nullable

If file upload is nullable, then `application/json` will also work, just don't upload the file

# Security

Before any read is performed can check the `EzModel` permissions, so should be no changes here

# Storage Location

We can store the files at the folder `EntityName/propertyName`

For example `Post/image`

The root folder will either be `tmp/files` or an S3 compatible storage like digital ocean spaces or S3 itself or whatever (This is dependent on the `ENV` variable, if `development` then `tmp/files` and S3 compatible storage otherwise)

File name could be the `inputFileName-someHashToPreventCollision`

So full example could be

`tmp/files/Post/image/avatar-178d9e82yd78hjxe7a63.png`

# Configuration

There should be minimal configuration required depending on whether the environment is `production` or `development` it should adjust accordingly

# Streaming Support?

I think we can just support uploading the full file in one go first, but certainly we should develop in such a way that adding streaming support is not a hassle

Additional Note: How the heck does streaming work?

# Uploading via presigned URL to reduce server load?

I think this one can KIV, but during implementation we can keep this in mind so as to make it extensible for this

# Issues

Currently form data is being processed in `application/json` format, whereas file input is usually in `multipart form` format... Hmm...

Maybe we can accept both input formats? `application/json` just don't accept files whereas for `multipart form` we accept the files

# Underlying Tech

Possiblities include

1. formidable (They claim its fast lmao)
2. multer (Multer is quite common so maybe stick to this)
3. fastify-multipart (Using busboy under the hood, probably best performance and streaming support)

Probably we will go with `fastify-multipart` to support streaming in the future