// setupDevTools.js
if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
  global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    inject: () => {},
    onCommitFiberRoot: () => {},
    onCommitFiberUnmount: () => {},
  };
}
