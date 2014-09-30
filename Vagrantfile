# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
	config.vm.define "ng-frontend"
	config.vm.box = "hashicorp/precise64"

	config.vm.network "private_network", ip: "10.0.3.2"

	config.vm.synced_folder ".", "/var/lib/frontend", type: "rsync", rsync__exclude: [".git/", "node_modules/"]
	config.vm.synced_folder "../ng-git", "/var/lib/ng-git", type: "rsync", rsync__exclude: [".git/", "node_modules/"]

	config.vm.provider "virtualbox" do |v|
		v.memory = 4086
		v.cpus = 2
	end

	config.vm.provision :shell do |s|
		s.inline = <<-EOT
			apt-get update
			apt-get install -y curl
			curl -sSL https://get.docker.io/ubuntu/ | sudo sh
		EOT
	end

	config.vm.provision :docker do |d|
		d.pull_images "castawaylabs/node-docker"
		d.pull_images "castawaylabs/mongodb-docker"
		d.pull_images "castawaylabs/redis-docker"
		d.pull_images "hopsoft/graphite-statsd"

		d.run "graphite_statsd",
			image: "hopsoft/graphite-statsd",
			args: "-p 8080:80 -p 2003:2003 -p 8125:8125/udp",
			cmd: "/opt/hopsoft/graphite-statsd/start"

		d.run "ng_mongodb",
			image: "castawaylabs/mongodb-docker",
			args: "-p 2017:27017 -v /var/lib/mongodb:/var/lib/mongodb",
			cmd: "mongod --config /etc/mongod.conf --smallfiles --noauth"

		d.run "ng_redis",
			image: "castawaylabs/redis-docker",
			args: "-p 6379:6379 -v /var/lib/redis:/var/lib/redis"

		d.run "ng_git",
			image: "castawaylabs/node-docker",
			args: "-v /var/lib/ng-git:/srv/app --link ng_redis:redis --link ng_mongodb:mongodb"

		d.run "ng_frontend",
			image: "castawaylabs/node-docker",
			args: "-e PORT=80 -e NODEMON=y -p 80:80 -v /var/lib/frontend:/srv/app --link ng_redis:redis --link ng_mongodb:mongodb"
	end
end
