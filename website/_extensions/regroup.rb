module BTorg
  
  class RegroupBlock < Liquid::Block
    include Liquid::StandardFilters
    # we need a language, but the linenos argument is optional.
    SYNTAX = /^([\w.]+) by ([\w.]+) as (\w+)/
    
    def initialize(tag_name, markup, tokens)
      super
      if markup =~ SYNTAX
        @list = $1
        @attribute = $2
        @group_name = $3
      else
        raise SyntaxError.new("Syntax Error in 'regroup' - Valid syntax: regroup <list> by <attribute> as <varaible_name>")
      end
    end

		def get_attribute_value item, attribute
			obj = item
			properties = attribute.split('.')

			properties.each do |prop|
				if obj.respond_to? :has_key?
					obj = obj[prop]
				else
					obj = obj.send(prop.to_sym)
				end
			end

			return obj
		end

    def render(context)
			list = get_attribute_value context, @list

			return '' unless list.length

			old_result = nil
			if context.has_key? @group_name
				old_result = context[@group_name]
			end

			old_grouper = nil
			if context.has_key? 'grouper'
				old_grouper = context['grouper']
			end

			prev_attribute = get_attribute_value list.first, @attribute
			current_group = []

			rendered = []

			list.each do |item|
				current_attribute = get_attribute_value item, @attribute
				if current_attribute != prev_attribute
					context[@group_name] = current_group
					context['grouper'] = prev_attribute
					rendered << super(context)
					current_group = []
				end

				current_group.push item
				prev_attribute = current_attribute
			end
			context[@group_name] = current_group
			context['grouper'] = prev_attribute
			rendered << super(context)


			context[@group_name] = old_result
			context['grouper'] = old_grouper

			return rendered
    end
	end
end

Liquid::Template.register_tag('regroup', BTorg::RegroupBlock)
