.PHONY: post

post:
	mkdir content/posts/$(shell date +'%Y-%m-%d')-$(name)
	mkdir content/posts/$(shell date +'%Y-%m-%d')-$(name)/images
	touch content/posts/$(shell date +'%Y-%m-%d')-$(name)/index.mdx

	echo "---" >> content/posts/$(shell date +'%Y-%m-%d')-$(name)/index.mdx
	echo "title: " >> content/posts/$(shell date +'%Y-%m-%d')-$(name)/index.mdx
	echo "slug: $(name)" >> content/posts/$(shell date +'%Y-%m-%d')-$(name)/index.mdx
	echo "author: Seonghyeon Kim" >> content/posts/$(shell date +'%Y-%m-%d')-$(name)/index.mdx
	echo "date: $(shell date +'%Y-%m-%d')" >> content/posts/$(shell date +'%Y-%m-%d')-$(name)/index.mdx
	echo "hero: ./images/title.png" >> content/posts/$(shell date +'%Y-%m-%d')-$(name)/index.mdx
	echo "excerpt: " >> content/posts/$(shell date +'%Y-%m-%d')-$(name)/index.mdx
	echo "---" >> content/posts/$(shell date +'%Y-%m-%d')-$(name)/index.mdx


