// shim.js
if (typeof navigator === 'undefined') {
  global.navigator = { userAgent: 'react-native' };
} else {
  navigator.userAgent = 'react-native';
}

if (typeof window === 'undefined') {
  global.window = global;
}

if (typeof location === 'undefined') {
  global.location = { href: '' };
}