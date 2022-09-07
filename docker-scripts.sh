docker build --tag file-downloader .
# docker rmi -f file-downloader
docker run -d file-downloader
docker ps --all