import requests as reqs
from directus import DirectusClient
import json

import keywords

# client = DirectusClient(url="https://zummie.com", project="yt888", email = "clb478@nyu.edu", password="PGE6JNN3MKzxWq^3BbEP@K")
# videos, metadata = client.get_all_items_list(collection="video",sort = ["video_id"])
# out = open('tempfile.txt','w')
# out.write(json.dumps(videos))

infile = open('tempfile.txt','r')

videos = json.loads(infile.readline())

infile.close()

print(len(videos))

count = 0
for video in videos:
	found_flag = False
	desc = video['description']
	# data = '{"video_id":"' + video['video_id'] + '", "keywords":{'
	data = '{"keywords":{'
	string = ""
	for category in keywords.keywords:
		cat_flag = False
		tempstring = str(category) + " "
		tempdata = '"' + category + '":["'
		for word in keywords.keywords[category]: 
			if word in desc:
				found_flag = True
				cat_flag = True
				# print(word + ' found')
				tempdata = tempdata + word + '", "'
				tempstring = tempstring + word + " " 
		if cat_flag:
			data = data + tempdata[:-3] + '],'
			string = string + tempstring

	data = data[:-1] + '}, "keyword_string":"' + string  + '"}'
	
	if found_flag:
		print(video['video_id'])
		# print(data)
		count += 1

		js = json.loads(data)

		ret = reqs.patch('https://zummie.com/yt888/items/video/' + video['video_id'] + '?access_token=d6d541d0-b595-430e-b6a2-047ac6ee63e3',json = js)
		print(ret)
	# print(ret.text)

	# if video['video_id'] == 'IARJDejbvMc':
	# 	break
	# if count >= 1:
	# 	break

print(str(count) + ' covid vids found and updated')