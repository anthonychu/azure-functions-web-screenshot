const Pageres = require('pageres');
const Azure = require("@azure/storage-blob");

module.exports = async function (context, req) {
  const pageres = new Pageres()
    .src('https://anthonychu.ca/', ['1280x1024']);

  const streams = await pageres.run();

  const accountName = process.env.STORAGE_ACCOUNT_NAME;
  const accessKey = process.env.STORAGE_ACCESS_KEY;

  const ONE_MEGABYTE = 1024 * 1024;
  const FOUR_MEGABYTES = 4 * ONE_MEGABYTE;
  const credentials = new Azure.SharedKeyCredential(accountName, accessKey);
  const pipeline = Azure.StorageURL.newPipeline(credentials);
  const serviceURL = new Azure.ServiceURL(`https://${accountName}.blob.core.windows.net`, pipeline);
  const containerURL = Azure.ContainerURL.fromServiceURL(serviceURL, 'foo');
  const blockBlobURL = Azure.BlockBlobURL.fromContainerURL(containerURL, 'foo.png');

  await Azure.uploadStreamToBlockBlob(
    Azure.Aborter.none,
    streams[0],
    blockBlobURL,
    FOUR_MEGABYTES,
    5,
    {
      blobHTTPHeaders: {
        blobContentType: "image/png"
      }
    });

  context.res.status = 302;
  context.res.setHeader('Location', blockBlobURL.url);
};