const mcache = require("memory-cache");
const handleGetTree = require("./getGithubTree");

const cache = new mcache.Cache();

module.exports = async function resolveCache(req, res) {
  const repository = req.query.repoUrl;
  let response;

  if (cache.get(repository)) {
    response = cache.get(repository);
    console.log(`Cached response of: ${repository}`);
  } else {
    const tree = await handleGetTree(repository, true);
    response = cache.put(repository, tree, parseInt(process.env.CACHED_TIME));
    console.log(`New made (and now cached) response of: ${repository}`);
  }

  res.send(response);
};
