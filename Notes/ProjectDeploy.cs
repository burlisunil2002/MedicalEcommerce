using DocumentFormat.OpenXml.Bibliography;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Http.HttpResults;
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

  </Target> */


/* <Target Name = "PublishReact" BeforeTargets = "Publish" >

	<Message Text = "========== Building React Application ==========" Importance = "high" />

	<!--Install dependencies-->
	<Exec
      WorkingDirectory = "$(MSBuildProjectDirectory)\sunilmedical-ui"
      Command = "npm ci"
      Condition = "Exists('$(MSBuildProjectDirectory)\sunilmedical-ui\package-lock.json')" />

	<Exec
      WorkingDirectory = "$(MSBuildProjectDirectory)\sunilmedical-ui"
      Command = "npm install"
      Condition = "!Exists('$(MSBuildProjectDirectory)\sunilmedical-ui\package-lock.json')" />

	<!--Build React-->
	<Exec
      WorkingDirectory = "$(MSBuildProjectDirectory)\sunilmedical-ui"
      Command = "npm run build" />

	<!--Create publish React folder -->
	<MakeDir Directories="$(PublishDir)wwwroot\react" />

	<!-- Collect React build files -->
	<ItemGroup>
		<ReactBuildFiles Include="$(MSBuildProjectDirectory)\sunilmedical-ui\build\**\*" />
	</ItemGroup>

	<!-- Copy React build into publish folder -->
	<Copy
		SourceFiles="@(ReactBuildFiles)"
		DestinationFiles="@(ReactBuildFiles->'$(PublishDir)wwwroot\react\%(RecursiveDir)%(Filename)%(Extension)')"
		SkipUnchangedFiles="true" />

	</Target> */

