const fetch = require("node-fetch");
require("dotenv").config();

module.exports = async function getTree(url, isRepoUrl) {
  const toFetchUrl = isRepoUrl
    ? `https://api.github.com/repos/${url.split(".com/")[1]}/contents/`
    : url;

  let data = await fetch(toFetchUrl, {
    headers: {
      Authorization: process.env.GITHUB_TOKEN,
    },
  })
    .then((res) => {
      if (!res.ok) {
        throw Error(res.statusText);
      }
      return res.json();
    })
    .then((fetchedData) =>
      fetchedData.map((item) => {
        if (item["type"] === "file") {
          return {
            name: item.name,
            type: item.type,
            kbSize: (item.size / Math.pow(1024, 1)).toFixed(2),
            html_url: item.html_url,
          };
        } else if (item["type"] === "dir") {
          return {
            name: item.name,
            type: item.type,
            html_url: item.html_url,
            children: item.url,
          };
        } else {
          return null;
        }
      })
    )
    .catch((error) => {
      /* console.log(
        "Oops, error... most likely the repo is private, I probably have a reason for that.",
        error
      ); */
    });

  const promisesArray = [];
  const itemsArray = [];
  data?.forEach((item) => {
    if (item["type"] === "dir") {
      const promise = getTree(item.children);
      promisesArray.push(promise);
      itemsArray.push(item);
    }
  });

  const promiseData = await Promise.all(promisesArray);

  itemsArray.forEach((item, index) => (item.children = promiseData[index]));

  return data;
};
