'use strict';

exports.isChromium = !!window.chrome || navigator.userAgent.toLowerCase().includes('electron');