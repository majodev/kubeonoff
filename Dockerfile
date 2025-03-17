# Build stage
FROM ubuntu:18.04 AS builder

RUN DEBIAN_FRONTEND=noninteractive apt-get -q update && \
	DEBIAN_FRONTEND=noninteractive apt-get -q install -y --no-install-recommends \
	build-essential \
	nodejs \
	python3.7 \
	python3-pip \
	python3-setuptools \
	python3-dev \
	npm \
	curl \
	&& rm -rf /var/lib/apt/lists/*

# Build Python dependencies
COPY requirements.txt /code/requirements.txt
RUN pip3 --no-cache-dir install -r /code/requirements.txt

COPY /setup.py /code/

# Build frontend
WORKDIR /code/kubeonoff-frontend
RUN npm install -g n && n 9.2.0
COPY kubeonoff-frontend/package.json kubeonoff-frontend/package-lock.json ./
RUN npm install

COPY kubeonoff-frontend .
RUN npm run build

COPY . /code

WORKDIR /code/
RUN python3 setup.py develop

# Final stage
FROM ubuntu:18.04

RUN DEBIAN_FRONTEND=noninteractive apt-get -q update && \
	DEBIAN_FRONTEND=noninteractive apt-get -q install -y --no-install-recommends \
	python3.7 \
	python3-pip \
	&& rm -rf /var/lib/apt/lists/*

# Copy only necessary files from builder
COPY --from=builder /code/kubeonoff-frontend/build /code/kubeonoff-frontend/build
COPY --from=builder /usr/local/lib/python3.6/dist-packages /usr/local/lib/python3.6/dist-packages
COPY --from=builder /code/kubeonoff /code/kubeonoff

WORKDIR /code
ENTRYPOINT ["python3", "-Xfaulthandler", "-u", "kubeonoff/main.py"]