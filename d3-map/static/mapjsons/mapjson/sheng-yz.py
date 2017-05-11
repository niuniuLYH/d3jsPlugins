#-*-coding:utf-8-*-
import json
import os


colors = eval(file('./color.txt', 'r').read())
colors = colors + colors

for f in os.listdir('./'):
    if f.endswith('.json'):
        map_json = eval(file(f, 'r').read())
        for idx, i in enumerate(map_json['features']):
            print idx
            print i['properties']['name']
            i['backColor'] = colors[idx]
        print f
        file(f, 'w').write(json.dumps(map_json))
        

