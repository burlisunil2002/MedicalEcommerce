using Org.BouncyCastle.Asn1.X509;


  /* <Target Name = "ReactBuild" BeforeTargets="Build">

		<Message Text = "Building React..." Importance="high" />

		<Exec WorkingDirectory = "$(MSBuildProjectDirectory)\sunilmedical-ui" Command="npm install" Condition="!Exists('$(MSBuildProjectDirectory)\sunilmedical-ui\node_modules')" />

		<Exec WorkingDirectory = "$(MSBuildProjectDirectory)\sunilmedical-ui" Command="npm run build" />

		<RemoveDir Directories = "$(ProjectDir)wwwroot\react" ContinueOnError="true" />

		<MakeDir Directories = "$(ProjectDir)wwwroot\react" />


        < ItemGroup >

            < ReactFiles Include="$(ProjectDir)sunilmedical-ui\build\**\*" />
		</ItemGroup>

		<Copy SourceFiles = "@(ReactFiles)" DestinationFiles="@(ReactFiles->'$(ProjectDir)wwwroot\react\%(RecursiveDir)%(Filename)%(Extension)')" SkipUnchangedFiles="true" />

	</Target>*/

