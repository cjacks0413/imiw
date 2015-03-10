require 'json'

routes = File.read('all_routes.json'); 
routes_hash = JSON.parse(routes); 
features = routes_hash["features"];
proportions = new Array(); 

CSV.foreach(ARGV[0]) do |site| 
	distSource = site[0]
	s = site[1]
	e = site[2]
	distMeters = findDistanceInMeters(s, e); 
	if distMeters > 0 
		proportions.push(distMeters / distSource)
	end 
end 

# sum all the numbers
average = proportions.reduce(:+)

puts average; 

def findDistanceInMeters(s, e)
	features['children'].each do |c|
		puts c['properties']['eToponym']
		if c['properties']['eToponym'] == s && c['properties']['sToponyms'] == e 
			return c['properties']['Meter'];
		else return 0 
		end 
	end 
end 




