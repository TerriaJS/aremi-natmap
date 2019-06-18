<!-- This document should be in two places: TerriaJS/terriajs and TerriaJS/TerriaMap. Make sure you update both copies when you change this document. --->

AREMI releases work a little bit differently to TerriaJS/nationalmap.

## Prerequisites

### awscli

Deploying requires a recent version of `awscli`. It's recommended to install and maintain this using python's `pip` as the Homebrew and Ubuntu packages are quite old.

```sh
pip install awscli
```

### AWS credentials

You must have an `awscli` configuration profile (in `~/.aws/config`) with a name that matches `awsProfile` in `package.json`.  e.g.

```
[profile aremi]
aws_access_key_id=YOUR_ACCESS_KEY
aws_secret_access_key=YOUR_SECRET_ACCESS_KEY
```

## Getting ready to deploy
### Git tag

Prior to deploying, please tag the release with the date, e.g.

```
git tag -a 2016-05-17a -m '2016-05-17a release'
```

Because we update the aremi-natmap repo by merging in the upstream TerriaJS/nationalmap, a tag for today's date might exist already. Add an `a` or something to the end to make your new tag unique. This is used to name the CloudFormation stack, so it's important to get it right. 

Before deploying, double check that the tag is correct with:
```
git describe
```
Also run:
```
git status
```
and make sure your working directory is clean and that all changes are pushed to the remote origin repository. This is generally the only time that you want to commit changes to `package-lock.json` if you've updated any npm packages.

Once you're happy with your release, remember to push the tag.
```
git push origin 2016-05-17
```

### Build
To make a new release build, run `./make_package`. Then copy the resulting `.tar.gz` into s3.

## Deploy

Deployment isn't done from this repo. Ask the team for the next steps :)
