
nodegear frontend
=================

Getting started
---------------

Required tools on the host:

- Git & Able to git clone from castawaylabs' gitlab
- Vagrant
- VirtualBox or other
- SSH
- BourneAgain SHell (if on Windows, use Git Bash). DOS shouldn't work, but haven't tried.
- ~4GB of free RAM. Vagrant is configured to use:
  - `1024MB` RAM for dev_frontend (+ 1 CPU core)
  - `2048MB` RAM for dev_services (+ 2 CPU cores)

1. Update git submodules. There must be non-empty directory under `deps/ng-models`
2. `git clone git@lab.castawaylabs.com:nodegear/infrastructure.git ../ng-infrastructure`
  - This is the ansible playbook used to provision the boxes
4. Run `vagrant up`
  - This will provision two boxes: `dev_services` and `dev_frontend`
5. Vagrant will provision the boxes using the ansible playbook in `../ng-infrastructure`

Ip address scheme for `development.yml`
---------------------------------------

Provisioned by Vagrant

| Hostname     | IP         |
| ------------ | ---------- |
| dev_services | `10.0.3.2` |
| dev_frontend | `10.0.3.4` |

Services
--------

They're deployed by ansible

| Service        | Host         | Port     |
| -------------- | ------------ | -------- |
| client_mongodb | dev_services | 27017    |
| client_mysql   |              | 3306     |
| ng_mongodb     |              | 2017     |
| ng_redis       |              | 6379     |
| ng_git         |              | -        |
| ng_fs          |              | 8888     |
| graphite       |              | 8080     |
| carbon         |              | 2003     |
| statsd         |              | 8125/udp |
| ng_frontend    | dev_frontend | 80       |

Graphite
--------

![screenshot](https://www.dropbox.com/s/101fvmuxlbefaki/Screenshot%202014-10-04%2016.53.13.png?dl=1)

Graphs metrics, access on dev_services box port 8080. The HTTP Auth login is

| Username | Password     |
| -------- | ------------ |
| castaway | AnsibleRocks |

To get into admin, use

| Username | Password     |
| -------- | ------------ |
| root     | root         |
