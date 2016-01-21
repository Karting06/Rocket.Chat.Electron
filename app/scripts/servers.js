/* globals $ */

import { EventEmitter } from 'events';

class Servers extends EventEmitter {
	constructor() {
		super();
		this.load();
	}

	get hosts() {
		return this._hosts;
	}

	set hosts(hosts) {
		this._hosts = hosts;
		this.save();
		return true;
	}

	get hostsKey() {
		return 'rocket.chat.hosts';
	}

	get activeKey() {
		return 'rocket.chat.currentHost';
	}

	load() {
		var hosts = localStorage.getItem(this.hostsKey);

		try {
			hosts = JSON.parse(hosts);
		} catch (e) {
			if (typeof hosts === 'string' && hosts.match(/^https?:\/\//)) {
				hosts = {};
				hosts[hosts] = {
					title: hosts,
					url: hosts
				};
			}

			localStorage.setItem(this.hostsKey, JSON.stringify(hosts));
		}

		if (hosts === null) {
			hosts = {};
		}

		if (Array.isArray(hosts)) {
			var oldHosts = hosts;
			hosts = {};
			oldHosts.forEach(function(item) {
				hosts[item] = {
					title: item,
					url: item
				};
			});
			localStorage.setItem(this.hostsKey, JSON.stringify(hosts));
		}

		this._hosts = hosts;
		this.emit('loaded');
	}

	save() {
		localStorage.setItem(this.hostsKey, JSON.stringify(this._hosts));
		this.emit('saved');
	}

	validateHost(hostUrl, timeout) {
		console.log('Validating hostUrl', hostUrl);
		timeout = timeout || 5000;
		return new Promise(function(resolve, reject) {
			var resolved = false;
			$.getJSON(`${hostUrl}/api/info`).then(function() {
				if (resolved) {
					return;
				}
				resolved = true;
				console.log('HostUrl valid', hostUrl);
				resolve();
			},function(request) {
				if (resolved) {
					return;
				}
				resolved = true;
				console.log('HostUrl invalid', hostUrl);
				reject(request.status);
			});
			if (timeout) {
				setTimeout(function() {
					if (resolved) {
						return;
					}
					resolved = true;
					console.log('Validating hostUrl TIMEOUT', hostUrl);
					reject();
				}, timeout);
			}
		});
	}

	hostExists(hostUrl) {
		var hosts = this.hosts;

		return !!hosts[hostUrl];
	}

	addHost(hostUrl) {
		var hosts = this.hosts;

		if (this.hostExists(hostUrl) === true) {
			return false;
		}

		hosts[hostUrl] = {
			title: hostUrl,
			url: hostUrl
		};
		this.hosts = hosts;

		this.emit('host-added', hostUrl);

		return true;
	}

	removeHost(hostUrl) {
		var hosts = this.hosts;
		if (hosts[hostUrl]) {
			delete hosts[hostUrl];
			this.hosts = hosts;
			this.emit('host-removed', hostUrl);
		}
	}

	get active() {
		return localStorage.getItem(this.activeKey);
	}

	setActive(hostUrl) {
		if (this.hostExists(hostUrl)) {
			localStorage.setItem(this.activeKey, hostUrl);
			this.emit('active-changed', hostUrl);
			return true;
		}
		return false;
	}

	clearActive() {
		localStorage.removeItem(this.activeKey);
		this.emit('active-cleared');
		return true;
	}
}

export var servers = new Servers();
