# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
	config.vm.define "ng-frontend"
	config.vm.box = "yungsang/boot2docker"

	config.vm.network "private_network", ip: "10.0.3.2"

	config.vm.synced_folder ".", "/vagrant"

	config.vm.provider "virtualbox" do |v|
		v.memory = 1024
		v.cpus = 2
	end

	config.vm.provision :shell do |s|
		s.inline = <<-EOT
			if ! grep -qs ^nameserver /etc/resolv.conf; then
				sudo /sbin/udhcpc
			fi
			cat /etc/resolv.conf
		EOT
	end

	config.vm.provision :shell do |s|
		s.inline = <<-EOT
			sudo /usr/local/bin/ntpclient -s -h pool.ntp.org
			date
		EOT
	end

	config.vm.provision :docker do |d|
		d.pull_images "castawaylabs/node-docker"
		d.pull_images "castawaylabs/mongodb-docker"
		d.pull_images "castawaylabs/redis-docker"

		d.run "ng_mongodb",
			image: "castawaylabs/mongodb-docker",
			args: "-p 27017:27017 -v /var/lib/mongodb:/var/lib/mongodb",
			cmd: "mongod --config /etc/mongod.conf --smallfiles --noauth"

		d.run "ng_redis",
			image: "castawaylabs/redis-docker",
			args: "-p 6379:6379 -v /var/lib/redis:/var/lib/redis"

		d.run "ng_frontend",
			image: "castawaylabs/node-docker",
			args: "-e PORT=80 -p 80:80 -v /vagrant:/srv/app --link ng_redis:redis --link ng_mongodb:mongodb"
	end
end
