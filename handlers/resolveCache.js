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
    await handleGetTree(repository).then((res) => {
      if (res) {
        response = cache.put(
          repository,
          res,
          parseInt(process.env.CACHED_TIME)
        );
        console.log(`New made (and now cached) response of: ${repository}`);
      } else {
        console.log(`A problem was found while fetching ${repository}`);
        return null;
      }
    });
  }

  res.send(response);
};
