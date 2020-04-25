import requests as reqs
from directus import DirectusClient
import json
import string

import keywords
from nltk import sent_tokenize
from nltk import word_tokenize
from nltk.corpus import stopwords
import re

infile = open('tempfile.txt','r')

videos = json.loads(infile.readline())

infile.close()

desc = {}

stop_words = set(stopwords.words('english'))

urls = {}

count = 0

# for video in videos:
# 	if video['video_id'] == '-2V-Fidbe4Q':
# 		print(video)

for video in videos:
	video_id = video['video_id']
	urls[video_id] = re.findall(r"http\S+", video['description'])
	descstr = re.sub(r"http\S+", "", video['description'])
	for url in re.findall(r"www\S+", descstr):
		urls[video_id].append(url)
	descstr = re.sub(r"www\S+", "", descstr)
	# print(urls[video_id])
	word_list = word_tokenize(descstr)
	# print(word_list)
	table = str.maketrans('', '', string.punctuation)
	word_list = [w.lower().translate(table) for w in word_list]
	# print(word_list)
	word_list = [word for word in word_list if word.isalpha()]
	word_list = [word for word in word_list if word not in stop_words]
	# print(word_list)
	desc[video_id] = word_list
	count += 1
	if count >=100:
		break

print(urls)
print(desc)