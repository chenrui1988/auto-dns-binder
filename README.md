# 自动获取动态公网IP，并绑定DNS域名

借助路由器的DMZ将自己的内网树莓派发布到公网，作为公网可访问的服务器，并绑定域名。目前接入联通光纤，联通分配的是动态IP，对于域名绑定很不方便，所以编写程序，定时获取公网IP，并修改DNS域名解析配置。

## 运行要求  
1. NodeJs 6+   
2. 可以设置DMZ的路由器  
3. 备案域名，使用阿里云DNS域名解析  


## 运行说明  

程序每半小时检测一次，正在执行前，需要配置环境变量：  

1. ADB_DOMAIN， 要绑定的域名，like pi.arui.me  
2. ADB_ACCESS_KEY, 阿里云账户的Access Key ID  
3. ADB_ACCESS_SECRET，阿里账户的Access Secret  
4. ADB_INTERVAL_SECOND，检测间隔，单位秒，默认60s

配置完成，执行命令：  
``` 
$ npm install
$ npm start
run auto dns binder at 2017-09-24T14:27:23.389Z
get unicom ip : [114.245.192.67] equals with last unicom ip!
```

## 在Docker中运行

编译镜像，并部署到Docker Swarm环境中，执行命令：
```
cd auto-dns-binder 
docker build . -t 'auto-dns-binder:1.0' -t 'auto-dns-binder:latest'
docker service create --name anto-dns-binder -e ADB_ACCESS_KEY=xxx -e ADB_ACCESS_SECRET=xxx -e ADB_DOMAIN=xxx registry.cn-beijing.aliyuncs.com/kv/auto-dns-binder:1.0
```