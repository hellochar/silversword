require 'rake'

task :default => :compile

task :clean do
    if File.exist?('js/ss.js')
        File.unlink('js/ss.js')
    end
end

task :compile => :clean do

    File.open("js/ss.js", 'a') do |ssjs|

        # concat minified js
        Dir[File.join("js", "src", "min", "*.js")].each do |file|
            ssjs.puts(File.read(file))
        end

        # minify the rest and concat it
        to_compile = Dir.glob(File.join("js", "src", "*.js"))
        compiled = %x( java -jar compiler.jar #{to_compile.map{|fn| "--js #{fn} "}.join()} )
        ssjs.puts compiled

    end

    puts "Wrote js/ss.js!"
end
