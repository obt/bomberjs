require 'hpricot'
require 'cgi'

module BTorg

  module Filters
    def html_truncatewords input, words = 15, truncate_string = "..."
      doc = Hpricot.parse(input)
      (doc/:"text()").to_s.split[0..words].join(' ') + truncate_string
    end

    def css_path_to_ids input
      html = Hpricot.parse(input)

      html.search("p,h1,h2,h3,h4,h5,h6,ul,dl,div,blockquote,table").each do |p|
        p.set_attribute('id', p.css_path.gsub(/\s/,'').gsub(/[^a-zA-Z0-9_]/,'_').gsub(/(^_+|_+$)/,''))
      end

      html
    end

    def to_i x
      x.to_i
    end

    def html_escape x
      CGI.escape(x)
    end
  end  
end

Liquid::Template.register_filter(BTorg::Filters)
