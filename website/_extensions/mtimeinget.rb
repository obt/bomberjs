module BTorg
  
  class MtimeInGet < Liquid::Tag
    def initialize(tag_name, markup, tokens)
      super
      unless markup.nil? or markup.empty?
        @filename = markup.strip
      else
        raise SyntaxError.new("Syntax Error in 'mtimeinget' - Valid syntax: mtimeinget <filename>")
      end
    end

    def render(context)
      f = File::Stat.new context['site']['source']+@filename
			return @filename + '?' + f.mtime.to_i.to_s
    end
	end
end

Liquid::Template.register_tag('mtimeinget', BTorg::MtimeInGet)
