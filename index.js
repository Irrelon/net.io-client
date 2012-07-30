NetIo.Client = NetIo.EventingClass.extend({
	init: function (url) {
		this._socket = null;
		this._state = 0;

		// If we were passed a url, connect to it
		if (url !== undefined) {
			this.connect(url);
		}


	},

	connect: function (url) {
		var self = this;

		// Set the state to connecting
		this._state = 1;

		// Replace http:// with ws://
		url = url.replace('http://', 'ws://');

		// Create new websocket to the url
		this._socket = new WebSocket(url, 'netio1');

		// Setup event listeners
		this._socket.onopen = function () { self._onOpen.apply(self, arguments); };
		this._socket.onmessage = function () { self._onData.apply(self, arguments); };
		this._socket.onclose = function () { self._onClose.apply(self, arguments); };
		this._socket.onerror = function () { self._onError.apply(self, arguments); };
	},

	disconnect: function () {
		if (this._socket && this._socket.readyState === 1) {
			this._socket.close(1000, 'Client Disconnect');
		}
	},

	send: function (data) {
		// Encode packet and send to server
		data = this._encode(data);
		this._socket.send(data);
	},

	_onData: function (data) {
		// Decode packet and emit message event
		data = this._decode(data);
		this.emit('message', data);
	},

	_onOpen: function () {
		this._state = 2;
		this.emit('connect');
	},

	_onClose: function (code, reason, wasClean) {
		// If we are already connected...
		if (this._state === 2) {
			this._state = 0;
			this.emit('disconnect', {reason: reason, wasClean: wasClean, code:code});
		}

		// If we were trying to connect...
		if (this._state === 1) {
			this._state = 0;
			this.emit('error', {reason: 'Cannot establish connection, is server running?'});
		}
	},

	_onError: function () {
		this.log('An error occurred with the net.io socket!', 'error', arguments);
		this.emit('error', arguments);
	},

	_encode: function (data) {
		return JSON.stringify(data);
	},

	_decode: function (data) {
		return JSON.parse(data);
	}
});