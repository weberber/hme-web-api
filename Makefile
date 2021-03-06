dev-env-build:

	- docker-machine rm -f hme-keystore hme-master hme-slave-01

	docker-machine create -d virtualbox \
	--virtualbox-memory 512 \
	--virtualbox-disk-size 8192 \
	--virtualbox-cpu-count 1 \
	hme-keystore

	docker $(docker-machine config hme-keystore) run -d \
    -p "8500:8500" \
    -h "consul" \
    progrium/consul -server -bootstrap

	docker-machine create -d virtualbox \
	--swarm --swarm-image="swarm" --swarm-master \
	--swarm-discovery="consul://$(docker-machine ip hme-keystore):8500" \
	--engine-opt="cluster-store=consul://$(docker-machine ip hme-keystore):8500" \
	--engine-opt="cluster-advertise=eth1:2376" \
	hme-master

	docker-machine create -d virtualbox \
	--swarm --swarm-image="swarm" \
	--swarm-discovery="consul://$(docker-machine ip hme-keystore):8500" \
	--engine-opt="cluster-store=consul://$(docker-machine ip hme-keystore):8500" \
	--engine-opt="cluster-advertise=eth1:2376" \
	hme-slave-01

prod-env-build:
	docker-machine-pi rm hme-prod-master hme-prod-slave

	docker-machine-pi create -d hypriot \
	--hypriot-ip-address=192.168.168.120 \
	--swarm --swarm-master \
	--swarm-discovery="consul://192.168.168.120:8500" \
	--engine-opt="cluster-store=consul://192.168.168.120:8500" \
	--engine-opt="cluster-advertise=eth0:2375" swl-master

	eval $(docker-machine-pi env swl-master)

	docker run -d --restart=always -p 8500:8500 -h consul nimblestratus/rpi-consul -server -bootstrap

	docker-machine-pi create -d hypriot \
	--hypriot-ip-address=192.168.168.134 \
	--swarm  \
	--swarm-discovery="consul://192.168.168.120:8500" \
	--engine-opt="cluster-store=consul://192.168.168.120:8500" \
	--engine-opt="cluster-advertise=eth0:2375" swl-slave

prod-env-run:
	eval $(docker-machine-pi env --swarm swl-master)
	docker run -itd --name=web --net=pi-net --env="constraint:node==swl-master" hypriot/rpi-nano-httpd
	docker run -it --rm --net=pi-net --env="contraint:node=swl-slave" hypriot/armhf-busybox wget -O- http://web

check-node:
	docker run -ti --rm hypriot/rpi-consul members -rpc-addr=192.168.168.120:8400

dockerui:
	docker run -d -p 9000:9000 --name dockerui hypriot/rpi-dockerui -e http://192.168.168.120:2375
