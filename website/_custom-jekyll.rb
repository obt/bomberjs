#! /usr/bin/env ruby

require 'rubygems'

version = ">= 0"

if ARGV.first =~ /^_(.*)_$/ and Gem::Version.correct? $1 then
  version = $1
  ARGV.shift
end

require 'jekyll'
# Dynamically add other tags on a per site basis
if File.directory?('_extensions')
  Dir.chdir('_extensions') do
    Dir['*.rb'].each do |file|
      require file
    end
  end
end

gem 'mojombo-jekyll', version
load Gem.bin_path('mojombo-jekyll', 'jekyll', version)
