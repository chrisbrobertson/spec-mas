async function requestPatch({ failures, files }) {
  return {
    message: 'No patch provider configured',
    failures,
    files,
    patches: []
  };
}

module.exports = {
  requestPatch
};
