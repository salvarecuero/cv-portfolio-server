const fetch = require("node-fetch");
require("dotenv").config();

module.exports = async function getGithubTreeObject(repoUrl) {
  const defaultErrMsg = `Error while fetching ${repoUrl} Github tree :(`;
  const ownerAndRepoName = new URL(repoUrl).pathname;

  const commitFilesAndFolders = async (sha, branchName) => {
    const finalTree = await fetch(
      `https://api.github.com/repos${ownerAndRepoName}/git/trees/${sha}?recursive=true`,
      {
        headers: {
          Authorization: process.env.GITHUB_TOKEN,
        },
      }
    )
      .then((res) => {
        if (!res) return Error(defaultErrMsg);
        return res.json();
      })
      .then((commitData) => {
        return parseCommitData(commitData.tree, ownerAndRepoName, branchName);
      })
      .catch((err) => console.log(err));

    return await finalTree;
  };

  return await fetch(
    `https://api.github.com/repos${ownerAndRepoName}/branches`,
    {
      headers: {
        Authorization: process.env.GITHUB_TOKEN,
      },
    }
  )
    .then((res) => {
      if (!res) return Error(defaultErrMsg);
      return res.json();
    })
    .then(async (branchesData) => {
      if (branchesData.message?.startsWith("API rate limit exceeded"))
        throw Error(branchesData.message);
      const sha = branchesData[0].commit.sha;
      const branchName = branchesData[0].name;
      return await commitFilesAndFolders(sha, branchName);
    })
    .catch((err) => console.log(err));
};

const parseCommitData = (commitData, ownerAndRepoName, branchName) => {
  let repoTree = [];
  let rootTrees = commitData.filter(
    (element) => element.type === "tree" && !element.path.match("/")
  );
  let rootElements = commitData
    .filter((element) => element.type !== "tree" && !element.path.match("/"))
    .map((element) => {
      delete element.mode;
      delete element.sha;
      element.name = getElementName(element.path);
      element.kbSize = getElementSize(element.size);
      element.html_url = getElementURL(element, ownerAndRepoName, branchName);
      return element;
    });

  repoTree = rootTrees.map((tree) =>
    createDirectoryTree(tree, commitData, ownerAndRepoName, branchName)
  );
  return repoTree.concat(rootElements);
};

const createDirectoryTree = (
  directory,
  commitData,
  ownerAndRepoName,
  branchName
) => {
  const directoryPath = `${directory.path}/`;

  const allDirectoryPathContent = commitData.filter((element) =>
    element.path.startsWith(directoryPath)
  );

  let onlyDirectoryPathContent = allDirectoryPathContent
    .filter(
      (element) =>
        element.path.split("/").length === directoryPath.split("/").length
    )
    .map((element) => {
      if (element.type === "tree") {
        return createDirectoryTree(
          element,
          commitData,
          ownerAndRepoName,
          branchName
        );
      } else {
        element.name = getElementName(element.path);
        element.kbSize = getElementSize(element.size);
        element.html_url = getElementURL(element, ownerAndRepoName, branchName);
        delete element.mode;
        delete element.sha;
        return element;
      }
    });

  delete directory.mode;
  delete directory.sha;

  return {
    ...directory,
    name: getElementName(directory.path),
    html_url: getElementURL(directory, ownerAndRepoName, branchName),
    children: onlyDirectoryPathContent,
  };
};

// Utils
const getElementName = (path) => {
  return path.substring(path.lastIndexOf("/") + 1);
};

const getElementSize = (size) => {
  return (size / Math.pow(1024, 1)).toFixed(2);
};

const getElementURL = (element, ownerAndRepoName, branchName) => {
  if (element.type === "tree") {
    return `https://github.com${ownerAndRepoName}/tree/${element.path}`;
  } else {
    return `https://github.com${ownerAndRepoName}/blob/${branchName}/${element.path}`;
  }
};
