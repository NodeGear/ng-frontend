# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|

	config.vm.provision :ansible do |ansible|
		ansible.groups = {
			"services" => ["dev_services"],
			"frontend" => ["dev_frontend"],
			"development:children" => ["frontend", "services"]
		}

		ansible.playbook = "../ng-infrastructure/infrastructure.yml"

		ansible.limit = 'all'
	end

	config.vm.define :dev_services do |services|
		services.vm.box = "hashicorp/precise64"
		services.vm.network "private_network", ip: "10.0.3.2"
		services.vm.hostname = "dev-services"

		services.vm.synced_folder "../ng-git", "/var/lib/git", type: "rsync", rsync__exclude: [".git/", "node_modules/", "lib/credentials.json"]

		services.vm.provider "virtualbox" do |v|
			v.memory = 2048
			v.cpus = 2
		end
		
		services.vm.provision :ansible do |ansible|
			ansible.groups = {
				"services" => ["dev_services"],
				"development:children" => ["services"]
			}

			ansible.playbook = "../ng-infrastructure/services.yml"
		end
	end

	config.vm.define :dev_frontend do |frontend|
		frontend.vm.box = "hashicorp/precise64"
		frontend.vm.network "private_network", ip: "10.0.3.4"
		frontend.vm.hostname = "dev-frontend"

		frontend.vm.synced_folder ".", "/var/lib/frontend", type: "rsync", rsync__exclude: [".git/", "node_modules/", "lib/credentials.json"]

		frontend.vm.provider "virtualbox" do |v|
			v.memory = 1024
			v.cpus = 1
		end

		frontend.vm.provision :ansible do |ansible|
			ansible.groups = {
				"frontend" => ["dev_frontend"],
				"development:children" => ["frontend"]
			}

			ansible.playbook = "../ng-infrastructure/frontend.yml"
		end
	end
end